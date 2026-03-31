export const loginRegistrationUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await Registration.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        college: user.college,
        year: user.year,
        branch: user.branch,
        degree: user.degree,
        passoutYear: user.passoutYear,
        experience: user.experience,
      },
    });
  } catch (error) {
    console.error("loginRegistrationUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};