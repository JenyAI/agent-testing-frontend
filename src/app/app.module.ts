import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule }   from '@angular/router';

import { AppComponent } from './app.component';
import { SituationComponent } from './situation/situation.component';

import { AgentService } from './_services/agent.service';
import { DialogFlowService } from './_services/dialogflow.service';
import { SituationService } from './_services/situation.service';
import { UuidService } from './_services/uuid.service';

@NgModule({
  declarations: [
    AppComponent,
    SituationComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(
      [
        {
          path: '**',
          redirectTo: '',
          component: AppComponent
        }
      ]
    )
  ],
  providers: [
    AgentService,
    DialogFlowService,
    SituationService,
    UuidService
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
