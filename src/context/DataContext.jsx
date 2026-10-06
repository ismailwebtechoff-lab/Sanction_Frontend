import { createContext, useContext, useEffect, useState } from 'react'

import { useAuth } from './AuthContext'
import API from '../axios/axios';

const DataContext = createContext()

export const DataProvider = ({ children }) => {
  const {user} = useAuth(); // get logged in user
  const [sanctionContext,setSanctionContext] = useState([]);
  const [activityContext,setActivityContext] = useState([]);
  const [userContext,setUserContext] =useState('');
  const [allUserContext,setAllUserContext]= useState([]);
  const [profileContext,setProfileContext] = useState(null);
  useEffect(() => {
    if (user) { // ✅ Only fetch after login
      if(user?.role==="Admin"){
        fetchAllUserData();
      }
      fetchSanctionData();
      fetchUserData();
      fetchActivityData();
   //   fetchProfileData();
      

    } else {
        setSanctionContext([]);
      setUserContext("");
      setAllUserContext([]);
      setActivityContext([]);
      setProfileContext("");
      
    }
   
  }, [user]); // ✅ rerun whenever login/logout happens

  //Get all Sanction Data
  const fetchSanctionData = async () => {
    try {
      const res = await API.get('/sanction')
      const sorted = res.data.sort((a, b) => a.createdAt-b.createdAt)
      setSanctionContext(sorted);
    } catch (err) {
      console.error('Failed to load sanctions:', err)
    }
  }

  // get user's member data
  const fetchUserData = async ()=>{
    
    try {
      const res = await API.get(`/user/${user._id}`)
        setUserContext(res.data);
      
    } catch (err) {
      console.error('Failed to load user data:', err)
    }
      
  }


  // get all user data
  const fetchAllUserData = async()=>{
    try{
      const res = await API.get(`/user/getUser`);
      setAllUserContext(res.data);
      
    }catch(error){
      console.error('Failed to Load all user data:',error);
    }
  }
//get activity Data

const fetchActivityData = async()=>{
    try{
        const res = await API.get('/activityList');
        setActivityContext(res.data);
    }catch(error){
      console.error("Failed to Load activity data:",error);
    }
}
//get profile data

// const fetchProfileData = async()=>{
//   try {
//            const res=  await API.get("/profile");
//           setProfileContext(res.data|| null);
//             }
//         catch (error) {
//             console.error("Error fetching Profile in Data Context:", error);
//             }
// }
  return (
    <DataContext.Provider value={{
       sanctionContext,activityContext,userContext,allUserContext,profileContext,setProfileContext,
       setSanctionContext,setActivityContext,setUserContext,setAllUserContext}}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)