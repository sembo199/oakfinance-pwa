import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { SettingsService } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';
import { AppSettings, Language } from '../../models';
import { CURRENCIES } from '../../constants/currencies';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  styleUrls: ['settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe],
})
export class Settings implements OnInit {
  Language = Language;

  settings: AppSettings = {
    monthStartDay: 1,
    currency: 'USD',
    currencySymbol: '$',
    language: Language.EN
  };

  languages = [
    { code: Language.EN, name: 'English' },
    { code: Language.NL, name: 'Nederlands' },
    { code: Language.DE, name: 'Deutsch' },
    { code: Language.FR, name: 'Français' },
    { code: Language.ES, name: 'Español' },
    { code: Language.ZH, name: '中文' }
  ];

  constructor(
    private settingsService: SettingsService,
    private translationService: TranslationService,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.loadSettings();
  }

  async ionViewWillEnter() {
    await this.loadSettings();
  }

  async loadSettings() {
    this.settings = await this.settingsService.get();
  }

  async changeMonthStartDay() {
    const alert = await this.alertCtrl.create({
      header: 'Month Start Day',
      subHeader: 'Select the day your month starts (e.g., payday)',
      inputs: [
        {
          name: 'day',
          type: 'number',
          placeholder: 'Day (1-31)',
          value: this.settings.monthStartDay,
          min: 1,
          max: 31
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
            const day = parseInt(data.day);
            if (day >= 1 && day <= 31) {
              await this.settingsService.setMonthStartDay(day);
              await this.loadSettings();
              this.showRestartMessage();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async changeCurrency() {
    const inputs = CURRENCIES.map(currency => ({
      type: 'radio' as const,
      label: `${currency.symbol} ${currency.name} (${currency.code})`,
      value: currency,
      checked: currency.code === this.settings.currency
    }));

    const alert = await this.alertCtrl.create({
      header: 'Select Currency',
      inputs,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (currency) => {
            if (currency) {
              await this.settingsService.setCurrency(currency.code, currency.symbol);
              await this.loadSettings();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async changeLanguage() {
    const inputs = this.languages.map(lang => ({
      type: 'radio' as const,
      label: lang.name,
      value: lang.code,
      checked: lang.code === this.settings.language
    }));

    const alert = await this.alertCtrl.create({
      header: this.t('settings.language'),
      inputs,
      buttons: [
        {
          text: this.t('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.t('settings.save'),
          handler: async (language: Language) => {
            if (language) {
              await this.settingsService.setLanguage(language);
              await this.translationService.setLanguage(language);
              await this.loadSettings();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  t(key: string): string {
    return this.translationService.translate(key);
  }

  async showRestartMessage() {
    const alert = await this.alertCtrl.create({
      header: 'Settings Updated',
      message: 'Go to the Tracker tab to see the updated month period.',
      buttons: ['OK']
    });

    await alert.present();
  }
}
