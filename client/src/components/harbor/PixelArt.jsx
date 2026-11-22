// 픽셀 아트 데이터(titleScene.js, dockScene.js 등)를 SVG로 그려 주는 컴포넌트
// - scene: { viewBox, layers: [{ className, rects: [[x, y, w, h, fill, opacity?], ...] }] }
// - 색이 '@#4a6fc0' 처럼 @로 시작하면 그 색의 디더링(체크무늬) 패턴으로 칠해요.
// - layers 의 className 으로 배·물결 같은 부분에만 CSS 애니메이션을 줄 수 있어요.
// - label 을 주면 화면 낭독기가 읽을 그림 설명이 되고, 없으면 장식용 그림으로 숨겨요.
import { useId } from 'react'

function PixelArt({ scene, className, label }) {
  // 한 화면에 그림이 여러 개여도 패턴 id가 겹치지 않게 고유 접두어를 써요.
  const uid = `px${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  const ditherColors = [
    ...new Set(scene.layers.flatMap((layer) => layer.rects.map((r) => r[4]).filter((f) => f.startsWith('@')))),
  ]
  const fillOf = (fill) => (fill.startsWith('@') ? `url(#${uid}-d${ditherColors.indexOf(fill)})` : fill)

  // 그림의 가로세로 비율을 viewBox에서 읽어 지정해요. (높이가 잘못 계산되어 위아래에 빈 띠가 생기지 않게)
  const [, , vbWidth, vbHeight] = scene.viewBox.split(' ').map(Number)

  return (
    <svg
      className={className}
      style={{ aspectRatio: `${vbWidth} / ${vbHeight}` }}
      viewBox={scene.viewBox}
      shapeRendering="crispEdges"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {ditherColors.length > 0 && (
        <defs>
          {ditherColors.map((color, i) => (
            <pattern key={color} id={`${uid}-d${i}`} width="2" height="2" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="1" height="1" fill={color.slice(1)} />
              <rect x="1" y="1" width="1" height="1" fill={color.slice(1)} />
            </pattern>
          ))}
        </defs>
      )}
      {scene.layers.map((layer, i) => (
        <g key={i} className={layer.className ?? undefined}>
          {layer.rects.map(([x, y, w, h, fill, opacity], j) => (
            <rect key={j} x={x} y={y} width={w} height={h} fill={fillOf(fill)} opacity={opacity} />
          ))}
        </g>
      ))}
    </svg>
  )
}

export default PixelArt
