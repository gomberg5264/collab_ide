import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';
// import { PadStatus } from './PadStatusModel';
// import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DataService {

  constructor(private http: Http) { }

  buildAndRun(data): Promise<Object> {
    let headers = new Headers({'content-type': 'application/json'});
    let options = new RequestOptions({ headers: headers });
    return this.http.post('http://localhost:4000/api/v1/build_and_run', data, options)
      .toPromise()
      .then((res: Response) => {
        if (res.json()['run'] == null) {
          return res.json()['build'];
        } else {
          return res.json()['run'];
      }
      })
      .catch(this.handleError);
  }

  getPadStatus(): Promise<Object> {
      return this.http.get('http://localhost:4000/api/v1/pad_status')
      .toPromise()
      .then((res: Response) => {
        return res.json();
    }).catch( this.handleError );
    }

    saveAndFetchPads(data): Promise<Object> {
      let headers = new Headers({'content-type': 'application/json'});
      let options = new RequestOptions({ headers: headers });
      return this.http.post('http://localhost:4000/api/v1/save_and_fetch_pads', {pad: data}, options)
        .toPromise()
        .then((res: Response) => {
          return res.json();
        })
        .catch(this.handleError);
    }
  // error handler
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purpose only
    return Promise.reject(error.body || error);
  }
}
