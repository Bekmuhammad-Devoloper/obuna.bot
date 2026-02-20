import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { UserService } from '../user/user.service';
import { DateUtils } from '../../common/utils/helpers';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(private readonly userService: UserService) {}

  // Obunadorlar Excel
  async generateSubscribersExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Obunadorlar');

    // Ustun sarlavhalari
    worksheet.columns = [
      { header: 'Telegram ID', key: 'telegramId', width: 15 },
      { header: "To'liq Ism", key: 'fullName', width: 25 },
      { header: 'Telefon', key: 'phoneNumber', width: 15 },
      { header: 'Kanal', key: 'channelName', width: 20 },
      { header: 'Boshlanish', key: 'startDate', width: 12 },
      { header: 'Tugash', key: 'endDate', width: 12 },
      { header: 'Qolgan Kunlar', key: 'daysLeft', width: 12 },
    ];

    // Sarlavha stilini o'zgartirish
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' },
    };

    // Ma'lumotlarni olish
    const subscribers = await this.userService.getSubscribersForExport();

    // Ma'lumotlarni qo'shish
    subscribers.forEach((sub) => {
      worksheet.addRow({
        telegramId: sub.telegramId,
        fullName: sub.fullName,
        phoneNumber: sub.phoneNumber,
        channelName: sub.channelName,
        startDate: DateUtils.format(new Date(sub.startDate)),
        endDate: DateUtils.format(new Date(sub.endDate)),
        daysLeft: sub.daysLeft,
      });
    });

    // Chegaralarni qo'shish
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // Qiziquvchilar Excel
  async generateInterestedExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Qiziquvchilar');

    // Ustun sarlavhalari
    worksheet.columns = [
      { header: 'Telegram ID', key: 'telegramId', width: 15 },
      { header: "To'liq Ism", key: 'fullName', width: 25 },
      { header: 'Telefon', key: 'phoneNumber', width: 15 },
      { header: "Ro'yxatdan o'tgan sana", key: 'createdAt', width: 20 },
    ];

    // Sarlavha stilini o'zgartirish
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2196F3' },
    };

    // Ma'lumotlarni olish
    const interested = await this.userService.getInterestedForExport();

    // Ma'lumotlarni qo'shish
    interested.forEach((user) => {
      worksheet.addRow({
        telegramId: user.telegramId,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        createdAt: DateUtils.format(new Date(user.createdAt)),
      });
    });

    // Chegaralarni qo'shish
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // Yangi obunachi uchun Excel (bitta user)
  async generateNewSubscriberExcel(userData: {
    telegramId: string;
    fullName: string;
    phoneNumber: string;
    channelName: string;
    startDate: Date;
    endDate: Date;
    amount: number;
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Yangi Obunachi');

    worksheet.columns = [
      { header: 'Telegram ID', key: 'telegramId', width: 15 },
      { header: "To'liq Ism", key: 'fullName', width: 25 },
      { header: 'Telefon', key: 'phoneNumber', width: 15 },
      { header: 'Kanal', key: 'channelName', width: 20 },
      { header: 'Boshlanish', key: 'startDate', width: 12 },
      { header: 'Tugash', key: 'endDate', width: 12 },
      { header: "To'lov (so'm)", key: 'amount', width: 15 },
      { header: 'Sana/Vaqt', key: 'timestamp', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' },
    };

    worksheet.addRow({
      telegramId: userData.telegramId,
      fullName: userData.fullName,
      phoneNumber: userData.phoneNumber,
      channelName: userData.channelName,
      startDate: DateUtils.format(userData.startDate),
      endDate: DateUtils.format(userData.endDate),
      amount: userData.amount,
      timestamp: DateUtils.formatDateTime(new Date()),
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // Yangi qiziquvchi uchun Excel (bitta user - obuna bo'lmagan)
  async generateNewInterestedExcel(userData: {
    telegramId: string;
    fullName: string;
    phoneNumber: string;
    channelName?: string;
    action: string; // "Kanalni ko'rdi", "To'lovni bekor qildi" va h.k.
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Qiziquvchi');

    worksheet.columns = [
      { header: 'Telegram ID', key: 'telegramId', width: 15 },
      { header: "To'liq Ism", key: 'fullName', width: 25 },
      { header: 'Telefon', key: 'phoneNumber', width: 15 },
      { header: 'Kanal', key: 'channelName', width: 20 },
      { header: 'Harakat', key: 'action', width: 25 },
      { header: 'Sana/Vaqt', key: 'timestamp', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC107' },
    };

    worksheet.addRow({
      telegramId: userData.telegramId,
      fullName: userData.fullName,
      phoneNumber: userData.phoneNumber,
      channelName: userData.channelName || '-',
      action: userData.action,
      timestamp: DateUtils.formatDateTime(new Date()),
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
