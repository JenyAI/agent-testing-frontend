import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/bufferCount';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/do';

import { environment } from '../../environments/environment';
import { SituationService } from './situation.service'
import { UuidService } from './uuid.service'

@Injectable()
export class AgentService {

  private devKey: string = '4ffe49da578145459de27ba91c47b77f';
  private sessionId = this.uuidService.generateUuid();

  private intents: any[ ];
  private subjectIntents: BehaviorSubject<any[ ]> = new BehaviorSubject([ ]);

  private intentsName: string[ ];
  private subjectIntentsName: BehaviorSubject<string[ ]> = new BehaviorSubject([ ]);

  constructor(
    private http: HttpClient,
    private situationService: SituationService,
    private uuidService: UuidService
  ) {
    if (this.devKey) {
      this.getIntents();
    }
  }



  /****************************************************************
  /*
  /*      INTERFACE
  /*
  /***************************************************************/



  /*  Get the dev key.

    PARAMS
      none

    RETURN
      (string) the dev key
  */
  public getKey(): string {
    return this.devKey;
  }

  /*  Update the dev key.

    PARAMS
      devKey (string)

    RETURN
      none
  */
  public updateKey(devKey): void {
    this.devKey = devKey;
    this.getIntents();
  }

  /*  Subscribe an observer for intents update.

    PARAMS
      observer (function)

    RETURN
      (Subscription)
  */
  public subscribeToIntent(observer): Subscription {
    return this.subjectIntents.subscribe(observer);
  }

  /*  Subscribe an observer for intents name update.

    PARAMS
      observer (function)

    RETURN
      (Subscription)
  */
  public subscribeToIntentsName(observer): Subscription {
    return this.subjectIntentsName.subscribe(observer);
  }

  /*  Send a message to the agent.

  PARAMS
    query (string): the text to send to the agent

  RETURN
    none
  */
  public sendMessage(query: string): Observable<{}> {
    let observable = new Observable(observer => {
      let url = `${environment.dialogflow.queryUrl}?v=${environment.dialogflow.v}`;

      let headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.devKey}`)
      .set('Content-Type', 'application/json; charset=utf-8');

      let body = {
        sessionId: this.sessionId,
        lang: 'en',
        query: query
      };

      this.http.post(url, body, { headers })
      .subscribe(raw => {
        observer.next(raw);
        observer.complete();
      });
    });

    return observable;
  }

  /*  Get the details of one intents from the agent

    PARAMS
      id (string): id of the intent to retrieve details

    RETURN
      void
  */
  public getIntentDetailsFromAgent(id: string): void {

    if (id && id != ' ') this.getIntentDetails(id).subscribe();
  }

  /*  Get the details of all intents from the agent

    PARAMS
      none

    RETURN
      void
  */
  public getIntentsDetailsFromAgent(): void {

    let intentsId = this.intents.map(i => i.id);
    Observable
    .from(intentsId)
    .bufferCount(1)
    .concatMap(ids => {
      let tasks = ids.map(id => this.getIntentDetails(id).delay(2000));

      return Observable.forkJoin(tasks);
    })
    .subscribe();
  }



  /****************************************************************
  /*
  /*      CORE
  /*
  /***************************************************************/



  /*  Get the list of intents from the agent

    PARAMS
      none

    RETURN
      void
  */
  private getIntents(): void {

    let url = `${environment.dialogflow.intentsUrl}?v=${environment.dialogflow.v}`;

    let headers = new HttpHeaders()
    .set('Authorization', `Bearer ${this.devKey}`)
    .set('Content-Type', 'application/json; charset=utf-8');

    this.http.get(url, { headers })
    .subscribe((raw: any[ ]) => {
      this.intents = raw.sort((i1: any, i2: any) => {
        if (i1.name <= i2.name) return -1;
        else return 1;
      });
      this.subjectIntents.next(this.intents);

      this.intentsName = this.intents.map(i => i.name);
      this.subjectIntentsName.next(this.intentsName);
    });
  }

  /*  Get intent details from the agent

    PARAMS
      id (string): id of the intent

    RETURN
      (Observable<any>)
  */
  private getIntentDetails(id: string): Observable<any> {

    let observable = new Observable(observer => {
      let url = `${environment.dialogflow.intentsUrl}/${id}?v=${environment.dialogflow.v}`;

      let headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.devKey}`)
      .set('Content-Type', 'application/json; charset=utf-8');

      let obs = {
        next: (details: any) => {
          details.userSays.forEach((us: any) => {
            if (!us.isTemplate) {
              let utterance = us.data.map((data: any) => data.text).join(' ');
              this.situationService.createSituation(details.name, utterance);
            }
          });

          observer.next(details);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
          observer.complete();
        },
        complete: () => {
          observer.complete();
        }
      };

      return this.http.get(url, { headers })
      .subscribe(obs);
    });

    return observable;
  }
}
