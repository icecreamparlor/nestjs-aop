import 'reflect-metadata';

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AopModule } from '../aop.module';
import { BarModule, BarService, barThisValue } from './fixture/bar';
import { FooModule, FooService, fooThisValue } from './fixture/foo';

describe('AopModule', () => {
  it('Lazy decoder overwrites the original function', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(fooService.foo('original', 0)).toMatchInlineSnapshot(`"original0:dependency_options"`);
  });

  it('Prototype of the overwritten function must be the original function', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);

    // In the 'SetOriginalTrue' decorator, the original field in the originalFn was set to true.
    // Verify that the 'fooService.foo' object has no properties and its 'original' property is true
    expect(Object.keys(fooService.foo)).toMatchInlineSnapshot(`Array []`);
    expect((fooService.foo as any)['original']).toBe(true);

    // Get the prototype of the 'fooService.foo' object and verify that it only has an 'original' property
    const proto = Object.getPrototypeOf(fooService.foo);
    expect(Object.keys(proto)).toMatchInlineSnapshot(`
          Array [
            "original",
          ]
        `);
    expect((proto as any)['original']).toBe(true);
  });

  it('Decorator order must be guaranteed', async () => {
    const module = await Test.createTestingModule({
      imports: [AopModule, FooModule],
    }).compile();

    const app = module.createNestApplication(new FastifyAdapter());
    await app.init();
    const fooService = app.get(FooService);
    expect(fooService.multipleDecorated('original', 0)).toMatchInlineSnapshot(
      `"original0:dependency_7:dependency_6:ts_decroator_5:ts_decroator_4:dependency_3:ts_decroator_2:dependency_1:dependency_0"`,
    );
  });

  describe('this of the decorated function must be this', () => {
    it('With AopModule', async () => {
      const module = await Test.createTestingModule({
        imports: [AopModule, FooModule],
      }).compile();

      const app = module.createNestApplication(new FastifyAdapter());
      await app.init();
      const fooService = app.get(FooService);

      fooService.thisTest();
      expect(fooThisValue).toBe(fooService);
    });

    it('Without AopModule', async () => {
      const module = await Test.createTestingModule({
        imports: [BarModule],
      }).compile();

      const app = module.createNestApplication(new FastifyAdapter());
      await app.init();
      const barService = app.get(BarService);

      barService.thisTest();
      expect(barThisValue).toBe(barService);
    });
  });
});
