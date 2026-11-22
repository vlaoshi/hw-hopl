// HTTP 상태 코드를 함께 담는 사용자 정의 에러예요.
// 컨트롤러에서 `throw new AppError(404, '상품을 찾을 수 없어요.')`처럼 사용해요.
export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
