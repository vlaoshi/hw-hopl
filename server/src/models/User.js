// 회원(User) 스키마
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// 회원 유형 목록 (다른 파일에서도 import해서 쓸 수 있게 내보내요)
export const USER_TYPES = ['customer', 'admin'];

const SALT_ROUNDS = 10; // 비밀번호 해시 강도

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수예요.'],
      unique: true, // 같은 이메일로 중복 가입 불가 (DB 인덱스)
      trim: true,
      lowercase: true, // Test@a.com 과 test@a.com 을 같은 이메일로 취급
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '이메일 형식이 올바르지 않아요.'],
    },
    name: {
      type: String,
      required: [true, '이름은 필수예요.'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수예요.'],
      minlength: [8, '비밀번호는 8자 이상이어야 해요.'],
      select: false, // 조회할 때 기본으로 제외 (필요하면 .select('+password'))
    },
    user_type: {
      type: String,
      required: [true, '회원 유형은 필수예요.'],
      enum: {
        values: USER_TYPES,
        message: '회원 유형은 customer 또는 admin 이어야 해요.',
      },
      default: 'customer', // 값을 주지 않으면 일반 회원
    },
    address: {
      type: String,
      trim: true,
      // 필수 아님
    },
  },
  {
    timestamps: true, // createdAt(생성 시각), updatedAt(수정 시각) 자동 관리
    toJSON: {
      // 응답(JSON)으로 보낼 때 비밀번호와 __v 는 항상 빼요.
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// 저장 전에 비밀번호를 해시(암호화)해서 원문이 DB에 남지 않게 해요.
// 비밀번호가 바뀌었을 때만 해시해요. (이름만 수정할 때 다시 해시되는 것 방지)
// ※ Mongoose 9부터는 next() 없이 async 함수로 작성해요.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// 로그인할 때 입력한 비밀번호가 맞는지 확인해요.
// 사용 예) const user = await User.findOne({ email }).select('+password');
//         const ok = await user.comparePassword(입력한비밀번호);
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
