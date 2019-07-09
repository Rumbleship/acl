import { AuthChecker } from 'type-graphql';
import { Authorizer } from '../authorizer';
import { PermissionsMatrix } from '../types';

// TODO: integrate jwt provided in the request header of HAPI...
export const RFIAuthChecker: AuthChecker<any> = (
  { root, args, context, info },
  definedRoleGroups
) => {
  const { value: authorization }: { value: Authorizer } = context.container.services.find(
    (s: { id: string }) => s.id === 'authorization'
  );
  const { operation } = info.operation;

  return authorization.allowedDecorator(definedRoleGroups[0] as PermissionsMatrix, operation, root);
};
