import { FastifyPluginAsync } from 'fastify';

import { Actor } from '@graasp/sdk';

import { ItemLoginService } from './db-service';
import { ItemLoginMemberCredentials, ItemLoginSchema } from './interfaces/item-login';
import common, { getLoginSchema, login, updateLoginSchema } from './schemas';
import { GetItemLoginSchemaTask } from './tasks/get-item-login-schema';
import { ItemLoginWithMemberIdTask } from './tasks/item-login-with-member-id-task';
import { ItemLoginWithUsernameTask } from './tasks/item-login-with-username-task';
import { UpdateItemLoginSchemaTask } from './tasks/update-item-login-schema';
import { ValidMemberSession } from './util/graasp-item-login-error';

export interface GraaspItemLoginOptions {
  /** id of the tag to look for in the item to allow the "log in" to item */
  tagId: string;
  graaspActor: Actor;
}

const plugin: FastifyPluginAsync<GraaspItemLoginOptions> = async (fastify, options) => {
  const { tagId, graaspActor } = options;
  const {
    items: { dbService: iS },
    itemMemberships: { dbService: iMS, taskManager: itemMembershipTaskManager },
    members: { dbService: mS },
    taskRunner: runner,
  } = fastify;

  const ilS = new ItemLoginService(tagId);

  // schemas
  fastify.addSchema(common);

  fastify.register(async (fastify) => {
    fastify.addHook('preHandler', fastify.attemptVerifyAuthentication);

    // get login schema for item
    fastify.get<{ Params: { id: string } }>(
      '/:id/login-schema',
      { schema: getLoginSchema },
      async ({ log, member, params: { id: itemId } }) => {
        const task = new GetItemLoginSchemaTask(member || graaspActor, itemId, iS);
        return runner.runSingle(task, log);
      },
    );

    // log in to item
    fastify.post<{
      Params: { id: string };
      Querystring: { m: boolean };
      Body: ItemLoginMemberCredentials;
    }>('/:id/login', { schema: login }, async (request) => {
      const {
        log,
        session,
        member,
        params: { id: itemId },
        body: credentials,
        query: { m },
      } = request;

      // if there's already a valid session, fail immediately
      if (member) throw new ValidMemberSession(member.id);

      const { username, memberId, password } = credentials; // TODO: allow for "empty" username and generate one (anonymous, anonymous+password)

      const t1 = username
        ? new ItemLoginWithUsernameTask(
            graaspActor,
            itemId,
            { username, password },
            ilS,
            iS,
            mS,
            iMS,
          )
        : new ItemLoginWithMemberIdTask(
            graaspActor,
            itemId,
            { memberId, password },
            ilS,
            iS,
            mS,
            iMS,
          );

      const t2 = itemMembershipTaskManager.createCreateTask(graaspActor, {});
      t2.getInput = () => {
        const {
          id: memberId,
          hasMembership,
          item: { path: itemPath },
        } = t1.result;
        if (!hasMembership) {
          return { data: { memberId, itemPath, permission: 'read', creator: graaspActor.id } };
        }
        t2.skip = true;
      };

      await runner.runSingleSequence([t1, t2], log);
      const { id, name } = t1.result;

      // app client
      if (m) {
        // TODO: can this be dangerous? since it's available in the fastify scope?
        // can this be done better with decorators on request/reply?
        const tokens = fastify.generateAuthTokensPair(id);
        return Object.assign({ id, name }, { tokens });
      }

      // set session
      session.set('member', id);
      return { id, name };
    });
  });

  // update login schema for item
  fastify.register(async (fastify) => {
    // authenticated member required
    fastify.addHook('preHandler', fastify.verifyAuthentication);

    fastify.put<{ Params: { id: string }; Body: { loginSchema: ItemLoginSchema } }>(
      '/:id/login-schema',
      { schema: updateLoginSchema },
      async ({ log, member, params: { id: itemId }, body: { loginSchema } }) => {
        const task = new UpdateItemLoginSchemaTask(member, itemId, loginSchema, iS, iMS);
        return runner.runSingle(task, log);
      },
    );
  });
};

export default plugin;
