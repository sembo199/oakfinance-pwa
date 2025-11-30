import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SettingsService } from './services/settings.service';
import { TranslationService } from './services/translation.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private settingsService: SettingsService,
    private translationService: TranslationService,
    private themeService: ThemeService
  ) {}

  async ngOnInit() {
    // Load saved language and initialize translations
    const settings = await this.settingsService.get();
    await this.translationService.setLanguage(settings.language);
  }
}
