import { useEffect, useState } from "react";
import { useAxios } from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext"; 

const useFetchUsers = () => {
  const { user } = useAuth(); 
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const axios = useAxios();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.user_id) { 
        setLoadingUsers(false);
        return;
      }

      try {
        const response = await axios.get("/users");

        const filteredUsers = response.data.filter(u => u.id !== user.user_id);

        const updatedUsers = filteredUsers.map(u => ({
          ...u,
          fullName: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Unknown User",
        }));

        setUsers(updatedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsersError("Failed to load users.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [axios, user?.user_id]);

  return { users, loadingUsers, usersError };
};

export default useFetchUsers;
