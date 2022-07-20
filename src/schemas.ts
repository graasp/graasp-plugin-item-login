export default {
  $id: 'http://graasp.org/item-login/',
  definitions: {
    credentials: {
      type: 'object',
      properties: {
        username: { type: 'string', minLength: 3, maxLength: 50, pattern: '^\\S+( \\S+)*$' },
        memberId: { $ref: 'http://graasp.org/#/definitions/uuid' },
        password: { type: 'string', minLength: 3, maxLength: 50, pattern: '^\\S+( \\S+)*$' },
      },
      oneOf: [{ required: ['username'] }, { required: ['memberId'] }],
      additionalProperties: false,
    },
    loginSchema: {
      type: 'object',
      required: ['loginSchema'],
      properties: {
        loginSchema: {
          type: 'string',
          // matches ItemLoginSchema enum in interface
          enum: ['username', 'username+password', 'anonymous', 'anonymous+password'],
        },
      },
      additionalProperties: false,
    },
  },
};

const login = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  querystring: {
    type: 'object',
    properties: { m: { type: 'boolean' } },
    additionalProperties: false,
  },
  body: { $ref: 'http://graasp.org/item-login/#/definitions/credentials' },
  response: {
    '2xx': { $ref: 'http://graasp.org/members/#/definitions/member' }, // TODO: remove passwordHash. How to "install" changes to the original schema??
    '4xx': { $ref: 'http://graasp.org/#/definitions/error' },
    '5xx': { $ref: 'http://graasp.org/#/definitions/error' },
  },
};

const getLoginSchema = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  response: {
    '2xx': {
      allOf: [{ $ref: 'http://graasp.org/item-login/#/definitions/loginSchema' }, { required: [] }],
    },
    '4xx': { $ref: 'http://graasp.org/#/definitions/error' },
    '5xx': { $ref: 'http://graasp.org/#/definitions/error' },
  },
};

const updateLoginSchema = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  body: { $ref: 'http://graasp.org/item-login/#/definitions/loginSchema' },
  response: {
    '2xx': { $ref: 'http://graasp.org/item-login/#/definitions/loginSchema' },
    '4xx': { $ref: 'http://graasp.org/#/definitions/error' },
    '5xx': { $ref: 'http://graasp.org/#/definitions/error' },
  },
};

export { login, getLoginSchema, updateLoginSchema };
