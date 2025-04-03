import { describe, it, expect } from 'vitest';
import { ErrorDetail } from '../errors';
import { AxiosErrors } from './AxiosMockBe';
import { createNGCore } from '../../index';
import { createApp } from 'vue';

const ngc = createNGCore();

const app = createApp({});
app.use(ngc);

describe('Backend Errors', () => {
  it('ErrorDetail', async () => {
    const date0 = new Date();

    const conectionError = new ErrorDetail(AxiosErrors.ConnectionAborted);
    expect(conectionError.clientDate.getTime()).toBeGreaterThanOrEqual(date0.getTime());
    expect({...conectionError}).toStrictEqual({
      error: AxiosErrors.ConnectionAborted,
      clientDate: conectionError.clientDate,
      clientMessage: 'timeout of 5000ms exceeded',
      method: "GET",
      url: "/api/v1/abcde/",
      request: undefined,
      response: undefined,
      message: 'Internal Error',
      status: -1,
    });

    const unathorizedError = new ErrorDetail(AxiosErrors.Unathorised);
    expect({...unathorizedError}).toStrictEqual({
      error: AxiosErrors.Unathorised,
      clientDate: unathorizedError.clientDate,
      clientMessage: 'Request failed with status code 401',
      status: 401,
      method: "GET",
      url: "/api/v1/abcde/",
      request: undefined,
      response: AxiosErrors.Unathorised.response,
      message: 'Authorization Error',
      detail: 'Authentication credentials were not provided.'
    });

    const postError = new ErrorDetail(AxiosErrors.PostFieldRequired);
    expect({...postError}).toStrictEqual({
      error: AxiosErrors.PostFieldRequired,
      clientDate: postError.clientDate,
      clientMessage: 'Request failed with status code 400',
      status: 400,
      method: "POST",
      url: "/api/v1/abcde/",
      request: undefined,
      response: AxiosErrors.PostFieldRequired.response,
      message: 'Validation Error',
      object: {
        password: [ 'This field is required.' ]
      }
    });

    const notFoundError = new ErrorDetail(AxiosErrors.NotFound);
    expect({...notFoundError}).toStrictEqual({
      error: AxiosErrors.NotFound,
      clientDate: notFoundError.clientDate,
      clientMessage: 'Request failed with status code 404',
      status: 404,
      method: "GET",
      request: undefined,
      response: AxiosErrors.NotFound.response,
      url: "/api/v1/abcde/",
      message: 'Resource not found',
    });
  });
})