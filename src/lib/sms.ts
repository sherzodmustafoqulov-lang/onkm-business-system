import prisma from './prisma';

export interface SendSmsParams {
  phone: string;
  message: string;
  userId?: string;
  code?: string;
}

/**
 * Transliterates Uzbek names (Cyrillic and Latin with apostrophes)
 * to clean ASCII for email / login generation.
 */
export function transliterateToLatin(text: string): string {
  if (!text) return '';

  const cyrillicToLatinMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'x', 'ҳ': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': 'o', 'қ': 'q', 'ғ': 'g',
    'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'e', 'Ё': 'yo',
    'Ж': 'j', 'З': 'z', 'И': 'i', 'Й': 'y', 'К': 'k', 'Л': 'l', 'М': 'm',
    'Н': 'n', 'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u',
    'Ф': 'f', 'Х': 'x', 'Ҳ': 'h', 'Ц': 'ts', 'Ч': 'ch', 'Ш': 'sh', 'Щ': 'sh',
    'Ъ': '', 'Ы': 'y', 'Ь': '', 'Э': 'e', 'Ю': 'yu', 'Я': 'ya',
    'Ў': 'o', 'Қ': 'q', 'Ғ': 'g'
  };

  let result = '';
  for (const char of text) {
    if (cyrillicToLatinMap[char] !== undefined) {
      result += cyrillicToLatinMap[char];
    } else {
      result += char;
    }
  }

  // Clean special characters: o' -> o, g' -> g, etc.
  return result
    .toLowerCase()
    .replace(/[ʻʼ'`]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Generates an @onkm.uz login from first and last name
 * Example: "Mustafaqulov Xayrulla" -> "x.mustafaqulov@onkm.uz"
 */
export function generateOnkmLogin(firstName: string, lastName: string, middleName?: string): string {
  const cleanFirst = transliterateToLatin(firstName);
  const cleanLast = transliterateToLatin(lastName);

  if (cleanFirst && cleanLast) {
    const firstInitial = cleanFirst.charAt(0);
    return `${firstInitial}.${cleanLast}@onkm.uz`;
  } else if (cleanLast) {
    return `${cleanLast}@onkm.uz`;
  } else if (cleanFirst) {
    return `${cleanFirst}@onkm.uz`;
  }
  return `xodim.${Math.floor(1000 + Math.random() * 9000)}@onkm.uz`;
}

/**
 * Generates a clean, strong temporary one-time password
 * Example: "Onkm*7492" or "ONKM-4821"
 */
export function generateTempPassword(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `Onkm*${randomNum}`;
}

/**
 * Sends SMS to employee phone number and logs it in the database
 */
export async function sendSms({ phone, message, userId, code }: SendSmsParams) {
  try {
    // Normalize phone number
    let cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('998')) {
        cleanPhone = '+' + cleanPhone;
      } else if (cleanPhone.length === 9) {
        cleanPhone = '+998' + cleanPhone;
      }
    }

    // Save to database SmsLog
    const smsLog = await prisma.smsLog.create({
      data: {
        userId: userId || null,
        phone: cleanPhone,
        message,
        code: code || null,
        status: 'SENT',
        provider: 'SIMULATED',
      },
    });

    // Console output for simulation / development logging
    console.log('\n============================================================');
    console.log('📱 [ONKM SMS GATEWAY - BIR MARTALIK PAROL YUBORILDI]');
    console.log(`👤 Qabul qiluvchi: ${cleanPhone}`);
    console.log(`✉️ Xabar matni:\n"${message}"`);
    console.log(`🕒 Vaqt: ${new Date().toLocaleString('uz-UZ')}`);
    console.log('============================================================\n');

    return {
      success: true,
      logId: smsLog.id,
      phone: cleanPhone,
      message,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: 'SMS yuborishda xatolik yuz berdi',
    };
  }
}
