import { Component } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import { AgentService } from '../_services/agent.service';
import { SituationService } from '../_services/situation.service';

@Component ({
  selector: 'app-perform-test',
  templateUrl: 'perform-test.component.html',
  styleUrls: [ 'perform-test.component.scss' ]
})
export class PerformTestComponent {

  private situations: any[ ] = this.situationService.getSituations();

  private maxSimultaneousQueries: number = 5;
  private simultaneousQueries: number = 0;

  constructor(
    private agentService: AgentService,
    private situationService: SituationService
  ) {
    this.performTest();
  }

  /*  Perform test on agent.

    PARAMS
      none

    RETURN
      none
  */
  private performTest(): void {
    this.situations.forEach(situation => {
      if (!situation.utterance || situation.utterance === '') return;

      this.agentService.sendMessage(situation.utterance).subscribe((raw: any) => {
        console.log(raw);
      });
    });
  }
}
