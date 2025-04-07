import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './App'
import Location from './Location/Loc'

const AllRoutes = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Home/>}/>
            <Route path='/detectlocation' element={<Location/>}/>
        </Routes>
    </BrowserRouter>
  )
}

export default AllRoutes