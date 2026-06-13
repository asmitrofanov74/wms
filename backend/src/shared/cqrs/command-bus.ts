export abstract class Command {}

export abstract class CommandHandler<TCommand extends Command, TResult> {
  abstract execute(command: TCommand): Promise<TResult>;
}
