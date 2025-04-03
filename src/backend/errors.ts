import axios, { AxiosError } from 'axios';
import { _t } from '../ngcore';

export interface ErrorObject {
  non_field_errors?: string | string[],
  [fieldname: string]: string | string[] | undefined | ErrorObject,
}

export class ErrorDetail {
  clientDate: Date;
  clientMessage?: string;
  status: number;
  message: string;
  detail?: string;
  object?: ErrorObject;
  method?: string;
  url?: string;
  error?: Error | AxiosError<any>;
  request?: any;
  response?: any;

  constructor (err: Error | AxiosError<any>) {
    this.clientDate = new Date();
    this.clientMessage = err.message;
    this.status = -1;
    this.message = _t('errors.internal');
    this.error = err;

    if (axios.isAxiosError(err)) {
      if (err.config?.method) {
        this.method = err.config.method.toUpperCase();
      }
      this.url = err.config?.url;
      this.response = err.response;
      this.request = err.request;

      if (err.response != null) {
        if (typeof err.response.data === "object") {
          if ('detail' in err.response.data) {
            this.detail = String(err.response.data.detail);
          }
          else {
            this.object = err.response.data;
          }
        }
        else if (err.response?.headers?.['Content-Type'] === 'text/plain') {
          this.detail = String(err.response.data);
        }
        else if (err.response?.headers?.['Content-Type'] === 'text/html') {
          // TODO: Extract body
        }

        this.status = err.response.status;
        switch (this.status) {
          case 400:
            this.message = _t('errors.validation');
            break;
          case 401:
            this.message = _t('errors.authorization');
            break;
          case 404:
            this.message = _t('errors.not_found');
            break;
          case 500:
            this.message = _t('errors.internal');
            break;
          default:
            this.message = _t('errors.api');
        }
      }
    }

    Object.freeze(this);
  }

}

