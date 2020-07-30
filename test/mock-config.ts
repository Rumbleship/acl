import { ISharedSchema } from '@rumbleship/config';
import { Oid } from '@rumbleship/oid';

export const MockConfig: Pick<ISharedSchema, 'AccessToken' | 'ServiceUser'> = {
  AccessToken: {
    secret: 'supersecrete'
  },
  ServiceUser: {
    id: Oid.create('User', 999999).toString(),
    credentials: {
      email: 'acl@test.rumbleship.com',
      password: 'acltestpassword'
    }
  }
};
