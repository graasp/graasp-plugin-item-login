import { UnknownExtra } from '@graasp/sdk';

export interface ItemMemberLogin {
  itemId: string;
  memberId: string;
  createdAt: string;
}

// Members
export interface ItemLoginMemberCredentials {
  memberId?: string;
  username?: string;
  password?: string;
}

// This information in 'member.extra' *can't* be shared - the serialization schema
// must not be extended with it.
export interface ItemLoginMemberExtra extends UnknownExtra {
  itemLogin: { password: string };
}

// Items
export enum ItemLoginSchema {
  Username = 'username',
  UsernameAndPassword = 'username+password',
  Anonymous = 'anonymous',
  AnonymousAndPassword = 'anonymous+password',
}

// This information in 'item.extra' *must* be shared - the item serialization schema
// needs to be/is extended with it (check this plugin's code)
export interface ItemLoginExtra extends UnknownExtra {
  itemLogin: { loginSchema: ItemLoginSchema };
}
