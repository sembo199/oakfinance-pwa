import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { PaymentLog, MonthPeriod } from '../../models';
import { PaymentLogService, ForecastData } from '../../services/payment-log.service';
import { RecurringPaymentService } from '../../services/recurring-payment.service';
import { DatePeriodService } from '../../services/date-period.service';
import { BalanceService } from '../../services/balance.service';
import { SettingsService } from '../../services/settings.service';
import { OneTimePaymentModalComponent } from '../../components/one-time-payment-modal/one-time-payment-modal.component';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface GroupedLogs {
  overdue: PaymentLog[];
  upcoming: PaymentLog[];
  completed: PaymentLog[];
}

@Component({
  selector: 'app-payment-tracker',
  templateUrl: './payment-tracker.page.html',
  styleUrls: ['./payment-tracker.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AppCurrencyPipe, TranslatePipe]
})
export class PaymentTrackerPage implements OnInit {
  currentPeriod: MonthPeriod = {
    periodStart: new Date(),
    periodEnd: new Date(),
    displayLabel: ''
  };
  allLogs: PaymentLog[] = [];
  groupedLogs: GroupedLogs = { overdue: [], upcoming: [], completed: [] };
  
  currentBalance: number = 0;
  currencySymbol: string = '$';
  forecast: ForecastData = {
    pendingExpenses: 0,
    pendingIncome: 0,
    forecastedBalance: 0
  };

  constructor(
    private paymentLogService: PaymentLogService,
    private recurringPaymentService: RecurringPaymentService,
    private datePeriodService: DatePeriodService,
    private balanceService: BalanceService,
    private settingsService: SettingsService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) { }

  async ngOnInit() {
    await this.initializePage();
  }

  async ionViewWillEnter() {
    await this.initializePage();
  }

  async initializePage() {
    await this.loadCurrentPeriod();
    await this.loadCurrencySymbol();
    await this.ensureLogsExist();
    await this.loadPaymentLogs();
    await this.loadBalance();
    this.calculateForecast();
  }

  async loadCurrencySymbol() {
    const settings = await this.settingsService.get();
    this.currencySymbol = settings.currencySymbol;
  }

  async loadCurrentPeriod() {
    const monthStartDay = await this.settingsService.getMonthStartDay();
    this.currentPeriod = this.datePeriodService.getCurrentPeriod(monthStartDay);
  }

  async ensureLogsExist() {
    const recurringPayments = await this.recurringPaymentService.getAllSortedByDay();
    await this.paymentLogService.ensureLogsForPeriod(this.currentPeriod, recurringPayments);
  }

  async loadPaymentLogs() {
    this.allLogs = await this.paymentLogService.getLogsByPeriod(this.currentPeriod);
    this.organizePaymentLogs();
  }

  async loadBalance() {
    this.currentBalance = await this.balanceService.getBalanceForPeriod(this.currentPeriod);
  }

  organizePaymentLogs() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue: PaymentLog[] = [];
    const upcoming: PaymentLog[] = [];
    const completed: PaymentLog[] = [];
    
    this.allLogs.forEach(log => {
      if (log.isCompleted) {
        completed.push(log);
      } else if (log.dueDate < today) {
        overdue.push(log);
      } else {
        upcoming.push(log);
      }
    });
    
    const sortByDueDate = (a: PaymentLog, b: PaymentLog) => 
      a.dueDate.getTime() - b.dueDate.getTime();
    
    overdue.sort(sortByDueDate);
    upcoming.sort(sortByDueDate);
    completed.sort((a, b) => 
      (b.completedDate?.getTime() || 0) - (a.completedDate?.getTime() || 0)
    );
    
    this.groupedLogs = { overdue, upcoming, completed };
  }

  calculateForecast() {
    this.forecast = this.paymentLogService.calculateForecast(this.currentBalance, this.allLogs);
  }

  async previousMonth() {
    this.currentPeriod = this.datePeriodService.getPreviousPeriod(this.currentPeriod);
    await this.ensureLogsExist();
    await this.loadPaymentLogs();
    await this.loadBalance();
    this.calculateForecast();
  }

  async nextMonth() {
    this.currentPeriod = this.datePeriodService.getNextPeriod(this.currentPeriod);
    await this.ensureLogsExist();
    await this.loadPaymentLogs();
    await this.loadBalance();
    this.calculateForecast();
  }

  async toggleCompleted(log: PaymentLog) {
    if (log.isCompleted) {
      await this.paymentLogService.markAsIncomplete(log.id);
    } else {
      await this.paymentLogService.markAsCompleted(log.id);
    }
    await this.loadPaymentLogs();
    this.calculateForecast();
  }

  async editAmount(log: PaymentLog) {
    const alert = await this.alertCtrl.create({
      header: 'Edit Amount',
      subHeader: log.name,
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Amount',
          value: log.amount,
          min: 0.01
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.amount && data.amount > 0) {
              await this.paymentLogService.updateLogAmount(log.id, parseFloat(data.amount));
              await this.loadPaymentLogs();
              this.calculateForecast();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmDeleteLog(log: PaymentLog) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Payment',
      message: `Are you sure you want to delete "${log.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.paymentLogService.delete(log.id);
            await this.loadPaymentLogs();
            this.calculateForecast();
          }
        }
      ]
    });

    await alert.present();
  }

  async onBalanceChange() {
    await this.balanceService.setBalanceForPeriod(this.currentPeriod, this.currentBalance);
    this.calculateForecast();
  }

  getForecastColor(): string {
    if (this.forecast.forecastedBalance >= 0) {
      return 'success';
    } else if (this.forecast.forecastedBalance >= -100) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  isCurrentPeriod(): boolean {
    const today = new Date();
    return today >= this.currentPeriod.periodStart && today <= this.currentPeriod.periodEnd;
  }

  async openAddOneTimePayment() {
    const modal = await this.modalCtrl.create({
      component: OneTimePaymentModalComponent,
      componentProps: {
        period: this.currentPeriod,
        type: 'expense'
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.payment) {
      await this.createOneTimePayment(data.payment);
    }
  }

  async createOneTimePayment(paymentData: any) {
    const log = {
      recurringPaymentId: undefined,
      name: paymentData.name,
      amount: paymentData.amount,
      dueDate: paymentData.dueDate,
      isCompleted: paymentData.isCompleted,
      completedDate: paymentData.completedDate,
      iconName: paymentData.iconName,
      dayOfMonth: paymentData.dueDate.getDate(),
      type: paymentData.type,
      periodStart: this.currentPeriod.periodStart,
      periodEnd: this.currentPeriod.periodEnd
    };

    await this.paymentLogService.create(log);
    await this.loadPaymentLogs();
    this.calculateForecast();
  }
}
