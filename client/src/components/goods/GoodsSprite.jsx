// 상품 도트 그림 - 도트 이미지 이름(image)으로 그림을 찾아 그려요. (없으면 '?' 나무 상자)
import PixelArt from '../harbor/PixelArt.jsx'
import { GOODS_SPRITES, UNKNOWN_SPRITE } from './goodsSprites.js'

function GoodsSprite({ image, name, className }) {
  return (
    <PixelArt
      scene={GOODS_SPRITES[image] ?? UNKNOWN_SPRITE}
      className={className}
      label={name ? `${name} 도트 그림` : undefined}
    />
  )
}

export default GoodsSprite
