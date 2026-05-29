const fs = require('fs');
const path = require('path');

const mappings = {
  'Ä Ã£ gá»­i': 'Đã gửi',
  'GiÃ¡ Ä‘á»  xuáº¥t': 'Giá đề xuất',
  'Thá» i gian': 'Thời gian',
  'ngÃ y': 'ngày',
  'Xem chi tiáº¿t': 'Xem chi tiết',
  'láº¡i': 'lại',
  'Chá»‰nh sá»­a': 'Chỉnh sửa',
  'Thu há»“i': 'Thu hồi',
  'KhÃ´ng thá»ƒ': 'Không thể',
  'Ä‘Ã£ Ä‘Æ°á»£c': 'đã được',
  'cháº¥p nháº­n': 'chấp nhận',
  'Ä‘Ã£ bá»‹': 'đã bị',
  'tá»« chá»‘i': 'từ chối',
  'LÆ°á»£t xem': 'Lượt xem',
  'Ä‘á»  xuáº¥t': 'đề xuất',
  'thÆ°Æ¡ng lÆ°á»£ng': 'thương lượng',
  'Báº¡n Ä‘Ã£': 'Bạn đã',
  'pháº£n há»“i': 'phản hồi',
  'Ä ang chá» ': 'Đang chờ',
  'báº¡n': 'bạn',
  'Báº¡n': 'Bạn',
  'GiÃ¡ thá» a thuáº­n': 'Giá thỏa thuận',
  'má»›i': 'mới',
  'Pháº£n há»“i ngay': 'Phản hồi ngay',
  'cá»§a báº¡n': 'của bạn',
  'Kinh nghiá»‡m liÃªn quan': 'Kinh nghiệm liên quan',
  'LÃ½ do': 'Lý do',
  'Ä Ã³ng': 'Đóng',
  'Báº¡n cÃ³ cháº¯c cháº¯n': 'Bạn có chắc chắn',
  'muá»‘n thu há»“i': 'muốn thu hồi',
  'nÃ y': 'này',
  'HÃ nh Ä‘á»™ng': 'Hành động',
  'khÃ´ng thá»ƒ': 'không thể',
  'hoÃ n tÃ¡c': 'hoàn tác',
  'Há»§y': 'Hủy',
  'Ä ang xá»­ lÃ½': 'Đang xử lý',
  'XÃ¡c nháº­n': 'Xác nhận',
  'Ä‘Ã£ thu há»“i': 'đã thu hồi',
  'Ä Ã£ thu há»“i': 'Đã thu hồi',
  'Ä‘Ã£': 'đã',
  'Ä Ã£': 'Đã',
  'khÃ´ng': 'không',
  'KhÃ´ng': 'Không'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [bad, good] of Object.entries(mappings)) {
    content = content.split(bad).join(good);
  }
  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkSync(currentDirPath) {
  if (!fs.existsSync(currentDirPath)) return;
  fs.readdirSync(currentDirPath).forEach(function (name) {
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if (stat.isFile() && filePath.endsWith('.tsx')) {
      processFile(filePath);
    } else if (stat.isDirectory()) {
      walkSync(filePath);
    }
  });
}

walkSync('src/pages/job');
walkSync('src/components/job');
