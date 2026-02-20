import { Context as TelegrafContext } from 'telegraf';
import { Update, Message, CallbackQuery } from 'telegraf/types';

export interface SessionData {
  step?: string;
  fullName?: string;
  phoneNumber?: string;
  selectedChannelId?: string;
  selectedPlanId?: string;
  paymentId?: string;
  adminAction?: string;
  broadcastType?: string;
  broadcastContent?: string;
  broadcastMediaFileId?: string;
  editChannelId?: string;
  editField?: string;
}

export interface BotContext extends TelegrafContext<Update> {
  session: SessionData;
  match?: RegExpExecArray;
}

export interface MessageContext extends BotContext {
  message: Update.New & Update.NonChannel & Message.TextMessage;
}

export interface CallbackContext extends BotContext {
  callbackQuery: CallbackQuery.DataQuery;
}
