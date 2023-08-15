import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

import { app } from '../../api.js';

describe('API E2E test suite', () => {
  let BASE_URL = '';
  let _server = {};
  let _globalToken = '';

  before(async () => {
    _server = app;
    _server.listen();
    await new Promise((resolve, reject) => {
      _server.once('listening', () => {
        const { port } = _server.address();
        BASE_URL = `http://localhost:${port}`;
        console.log('e2e rodando na', BASE_URL);
        resolve();
      });
    });
  });

  after((done) => _server.close(done));

  describe('/login', () => {
    it('should receive not authorized when user or password is invalid', async () => {
      const input = {
        user: 'invalid',
        password: 'invalid',
      };

      const result = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        body: JSON.stringify(input),
      });

      assert.strictEqual(
        result.status,
        401,
        `status code should be 401, actual: ${result.status}`
      );

      const expectedBody = { error: 'user invalid!' };
      const response = await result.json();
      assert.deepStrictEqual(
        response,
        expectedBody,
        `response.body should be ${JSON.stringify(
          expectedBody
        )}, actual: ${JSON.stringify(response)}`
      );
    });
    it('should login successfully given user and password', async () => {
      const input = {
        user: 'wsasouza',
        password: '12345',
      };

      const result = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        body: JSON.stringify(input),
      });

      const expect = 200;

      assert.strictEqual(
        result.status,
        expect,
        `status code should be 200, actual: ${result.status}`
      );

      const response = await result.json();
      assert.ok(
        response.token.length > 20,
        `response.body.token should be truthy, actual${JSON.stringify(
          response
        )}`
      );

      _globalToken = response.token;
    });
  });

  describe('/', () => {
    it('should not be allowed to access private data without a token', async () => {
      const input = {
        headers: {
          authorization: '',
        },
      };

      const result = await fetch(`${BASE_URL}/`, {
        method: 'GET',
        headers: input.headers,
      });

      const expect = 400;

      assert.strictEqual(
        result.status,
        expect,
        `status code should be 400, actual: ${result.status}`
      );

      const expectedBody = { error: 'invalid token!' };
      const response = await result.json();
      assert.deepStrictEqual(
        response,
        expectedBody,
        `response.body.token should be ${JSON.stringify(response)}`
      );
    });

    it('should be allowed to access private data with valid token', async () => {
      const input = {
        headers: {
          authorization: _globalToken,
        },
      };

      const result = await fetch(`${BASE_URL}/`, {
        method: 'GET',
        headers: input.headers,
      });

      const expect = 200;

      assert.strictEqual(
        result.status,
        expect,
        `status code should be 200, actual: ${result.status}`
      );

      const expectedBody = { result: 'Hey welcome!' };
      const response = await result.json();
      assert.deepStrictEqual(
        response,
        expectedBody,
        `response.body.token should be ${JSON.stringify(response)}`
      );
    });
  });
});
