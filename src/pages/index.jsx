import Layout from "./Layout.jsx";

import Home from "./Home";

import Library from "./Library";

import Playlists from "./Playlists";

import DJMode from "./DJMode";

import AutoDJ from "./AutoDJ";

import Recordings from "./Recordings";

import Profile from "./Profile";

import DJSetGenerator from "./DJSetGenerator";

import Discover from "./Discover";

import Setlists from "./Setlists";

import SharedContent from "./SharedContent";

import Offline from "./Offline";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Library: Library,
    
    Playlists: Playlists,
    
    DJMode: DJMode,
    
    AutoDJ: AutoDJ,
    
    Recordings: Recordings,
    
    Profile: Profile,
    
    DJSetGenerator: DJSetGenerator,
    
    Discover: Discover,
    
    Setlists: Setlists,
    
    SharedContent: SharedContent,
    
    Offline: Offline,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Library" element={<Library />} />
                
                <Route path="/Playlists" element={<Playlists />} />
                
                <Route path="/DJMode" element={<DJMode />} />
                
                <Route path="/AutoDJ" element={<AutoDJ />} />
                
                <Route path="/Recordings" element={<Recordings />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/DJSetGenerator" element={<DJSetGenerator />} />
                
                <Route path="/Discover" element={<Discover />} />
                
                <Route path="/Setlists" element={<Setlists />} />
                
                <Route path="/SharedContent" element={<SharedContent />} />
                
                <Route path="/Offline" element={<Offline />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}