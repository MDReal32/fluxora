import type { CamelCase, Promisable } from "type-fest";

import type { MergeObjects } from "@fluxora/types";
import type {
  Command as Cmd,
  CommandOptions,
  CommandReturnType,
  InferType,
  LiteralType,
  OptionType,
  Type
} from "@fluxora/types/cli";

import { logger } from "./logger";

export class Command<TOptions extends Record<string, Type> = {}> implements Cmd<TOptions> {
  private options = {} as CommandOptions<TOptions>;

  constructor(
    private readonly command: string,
    private readonly description?: string
  ) {
    logger.debug(`Created command: ${command} - ${description}`);
  }

  option<
    TName extends string,
    TType extends LiteralType,
    TAliasName extends string = TName,
    TUnionType extends string = string
  >(
    name: TName,
    type: TType | OptionType<TType, TAliasName> | (OptionType<"union", TAliasName> & { values: TUnionType[] })
  ): Command<
    MergeObjects<
      TOptions,
      Record<TName | TAliasName | CamelCase<TName> | CamelCase<TAliasName>, Type<TType, TUnionType>>
    >
  > {
    const resolvedValue = (typeof type === "string" ? { type } : type) as
      | OptionType<TType, TAliasName>
      | (OptionType<"union", TAliasName> & { values: TUnionType[] });
    const defaultValue = resolvedValue.defaultValue || null;

    const self = this as unknown as Command<
      MergeObjects<TOptions, Record<TName | TAliasName | CamelCase<TName> | CamelCase<TAliasName>, TType>>
    >;
    // @ts-ignore
    self.options[name] = {
      type: resolvedValue.type,
      defaultValue,
      values: "values" in resolvedValue ? resolvedValue.values : [],
      description: resolvedValue.description,
      alias: resolvedValue.alias
    } as OptionType<TType, TUnionType>;
    logger.debug(`Added option: ${name} - Type: ${resolvedValue.type}, Default: ${defaultValue}`);
    return self as any;
  }

  execute(
    executorFn?: (args: {
      [K in keyof TOptions]: InferType<TOptions[K]["type"], TOptions[K]["values"]>;
    }) => Promisable<void>
  ): CommandReturnType<{ [K in keyof TOptions]: TOptions[K] }> {
    logger.debug(`Setting execute handler for command: ${this.command}`);
    const self = this;
    return {
      command: this.command,
      description: this.description ?? null,
      options: this.options,
      async execute(args) {
        logger.debug(`Executing command: ${self.command} with args:`, args);
        await executorFn?.(args as any);
      }
    };
  }
}
