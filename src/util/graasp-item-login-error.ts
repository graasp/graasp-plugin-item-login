import { StatusCodes } from 'http-status-codes';

import { ErrorFactory } from '@graasp/sdk';

import { PLUGIN_NAME } from './constants';

export const GraaspError = ErrorFactory(PLUGIN_NAME);

export class ItemNotFound extends GraaspError {
  constructor(data?: unknown) {
    super(
      { code: 'GILERR001', statusCode: StatusCodes.NOT_FOUND, message: 'Item not found' },
      data,
    );
  }
}

export class MemberIdentifierNotFound extends GraaspError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GILERR002',
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Member identifier not found',
      },
      data,
    );
  }
}

export class InvalidMember extends GraaspError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GILERR003',
        statusCode: StatusCodes.NOT_FOUND,
        message: 'This member cannot be used to login to an item',
      },
      data,
    );
  }
}

export class MissingItemLoginSchema extends GraaspError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GILERR004',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'Missing login schema',
      },
      data,
    );
  }
}

export class MissingItemLoginTag extends GraaspError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GILERR005',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Item does not possess the required tag',
      },
      data,
    );
  }
}

export class ValidMemberSession extends GraaspError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GILERR006',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Member with valid session trying to (re)login',
      },
      data,
    );
  }
}

export class InvalidCredentials extends GraaspError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GILERR007',
        statusCode: StatusCodes.UNAUTHORIZED,
        // eslint-disable-next-line quotes
        message: "Provided credentials don't match member's",
      },
      data,
    );
  }
}

export class MissingCredentialsForLoginSchema extends GraaspError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GILERR008',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Missing credentials for set login schema',
      },
      data,
    );
  }
}

export class UnnecessaryCredentialsForLoginSchema extends GraaspError {
  constructor(data?: unknown) {
    super(
      {
        code: 'GILERR008',
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Unnecessary credentials for set login schema',
      },
      data,
    );
  }
}

export class MemberCannotAdminItem extends GraaspError {
  constructor(data?: unknown) {
    super(
      { code: 'GILERR009', statusCode: StatusCodes.FORBIDDEN, message: 'Member cannot admin item' },
      data,
    );
  }
}
