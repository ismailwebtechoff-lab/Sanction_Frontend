import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotFound from './pages/NotFound';
import LoginForm from './pages/LoginForm';
import PrivateRoute from './pages/PrivateRoute';
import Dashboard from './pages/dashboard/Dashboard';
import Sanction from './pages/sanction/Sanction';
import SanctionDetail from './pages/sanction/SanctionDetail';
import Activity from './pages/history/activity';
import UserList from './pages/userList/UserList';
import AppLayout from './components/layout/AppLayout';
import Unauthorized from './pages/unAuthorized/Unauthorized';
// import InstallPopup from './components/ui/InstallPopup';


function App() {
  return (
    <>
    
  <Router>
      <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute> }>
          <Route index element={<Dashboard />} />
          <Route path="/sanctions" element={<Sanction />} />
          <Route path="sanction/:id" element={<SanctionDetail/>}/>
          <Route path="/activity" element={<Activity />} />
          <Route path="/users" element={<PrivateRoute roles={['Admin','Owner']}><UserList /></PrivateRoute>} />
          <Route path="/unauthorized" element={<Unauthorized/>} />

          {/* add other routes here */}
          <Route path="*" element={<NotFound />} />
          </Route>
      </Routes>
    </Router>
    {/* <InstallPopup /> */}
     </>
  )
}

export default App