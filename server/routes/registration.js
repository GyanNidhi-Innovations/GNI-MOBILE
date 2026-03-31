import {
  checkEmail,
  sendOtp,
  verifyOtp,
  register,
  getCurrentRegistration,
  getRegistrationStats,
  loginRegistrationUser
} from '../controllers/registerController.js';

router.post('/login', loginRegistrationUser);