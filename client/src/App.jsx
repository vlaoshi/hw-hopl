// 주소(URL)별로 어떤 페이지를 보여줄지 정해요.
// 새 페이지를 만들면 여기에 <Route>를 추가하세요.
// 예) <Route path="products/:id" element={<ProductDetailPage />} />
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ComingSoonPage from './pages/ComingSoonPage.jsx'
import HarborPage from './pages/HarborPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminProductsPage from './pages/AdminProductsPage.jsx'
import AdminProductFormPage from './pages/AdminProductFormPage.jsx'
import CartPage from './pages/CartPage.jsx'

function App() {
  return (
    <Routes>
      {/* Layout(헤더, 푸터) 안에 각 페이지가 들어가요. */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="harbor" element={<HarborPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />

        {/* 헤더 메뉴 - 아직 만들지 않은 페이지는 "정비 중" 안내 */}
        <Route path="shop" element={<ComingSoonPage title="진열장" />} />
        <Route path="picks" element={<ComingSoonPage title="점장 추천상품" />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<ComingSoonPage title="주문 내역" />} />
        <Route path="mypage" element={<ComingSoonPage title="내 정보" />} />

        {/* 하플 상점주 대시보드 (관리자) */}
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="admin/products" element={<AdminProductsPage />} />
        <Route path="admin/products/new" element={<AdminProductFormPage />} />
        <Route path="admin/products/:id/edit" element={<AdminProductFormPage />} />
        <Route path="admin/orders" element={<ComingSoonPage title="주문 관리" />} />
        <Route path="admin/sales" element={<ComingSoonPage title="매출 분석" />} />
        <Route path="admin/merchants" element={<ComingSoonPage title="교역 상인 관리" />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 헤더·푸터 없이 전체 화면으로 보여주는 페이지 */}
      <Route path="signup" element={<SignupPage />} />
      <Route path="login" element={<LoginPage />} />
    </Routes>
  )
}

export default App
