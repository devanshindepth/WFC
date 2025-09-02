const axios = require('axios'); // FIX 1: Correctly import the axios library.
const fetchAdapter = require("@haverstack/axios-fetch-adapter");

const axiosInstance = axios.create({
  baseURL: 'https://488dc8de972c.ngrok-free.app',
  adapter: fetchAdapter,
  withCredentials: true,
})

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    // FIX 2: Remove TypeScript type assertion ('as ...') which is invalid in JavaScript.
    const originalConfig = error.config; 
    
    // Add the custom property directly to the config object
    if (!originalConfig._retry) {
      originalConfig._retry = false;
    }

    if (error.response && error.response.status === 401 && error.response.data.error === 'AccessTokenExpired') {
      console.log('DEBUGGER[INTERCEPTOR]:', 'Access token expired')
      if (!originalConfig._retry) {
        originalConfig._retry = true
        try {
          await refreshToken()
          console.log('DEBUGGER[INTERCEPTOR]:', 'Access token refreshed')
        } catch (refreshTokenError) {
          await logout()
          return await Promise.reject(refreshTokenError)
        }
        return await axiosInstance(originalConfig)
      } else {
        await logout()
      }
    }
    return await Promise.reject(error)
  }
)

const refreshToken = async () => await axiosInstance.post('/auth/refresh')
const logout = async () => await axiosInstance.post('/auth/logout')

module.exports = axiosInstance;