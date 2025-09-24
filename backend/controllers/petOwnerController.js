const petOwner = require("../models/petOwnerModel");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createToken = (_id, email, role = "petOwner") => {
  return jwt.sign({ _id, email, role }, process.env.SECRET, {
    expiresIn: "3d",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw Error("All fields must be filled");
    }

    const user = await petOwner.findOne({ email });
    if (!user) {
      throw Error("Incorrect email");
    }

    // Check if user uses OAuth
    if (user.oauthProvider && !user.password) {
      throw Error(
        `This account uses ${user.oauthProvider} login. Please sign in with ${user.oauthProvider}.`
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw Error("Incorrect password");
    }

    const token = createToken(user._id, user.email, "petOwner");
    res.status(200).json({
      username: user.name,
      email: user.email,
      userToken: token,
      uid: user._id,
      isOAuth: false,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const signin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!email || !password || !name) {
      throw Error("All fields must be filled");
    }

    // Check if user exists with OAuth
    const existingOAuthUser = await petOwner.findOne({
      email,
      oauthProvider: { $exists: true },
    });

    if (existingOAuthUser) {
      throw Error(
        "Email already registered with OAuth. Please use OAuth login."
      );
    }

    if (!validator.isAlpha(name, ["en-US"], { ignore: "-s" })) {
      throw Error("Name can only have letters");
    }
    if (!validator.isEmail(email)) {
      throw Error("Email not valid");
    }
    if (!validator.isStrongPassword(password)) {
      throw Error("Password not strong enough");
    }

    const exists = await petOwner.findOne({ email });
    if (exists) {
      throw Error("Email already in use");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await petOwner.create({ name, email, password: hash });

    const token = createToken(user._id, user.email, "petOwner");
    res.status(200).json({
      username: user.name,
      email: user.email,
      userToken: token,
      uid: user._id,
      isOAuth: false,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateUserDetailsFromToken = async (req, res) => {
  const { name, email, password } = req.body;
  const userID = req.user.id;

  try {
    // Find user first to check if they're OAuth user
    const existingUser = await petOwner.findById(userID);
    if (!existingUser) {
      throw Error("User not found");
    }

    // OAuth users can't set password
    if (password && existingUser.oauthProvider) {
      throw Error("OAuth users cannot set a password");
    }

    if (!name || !email) {
      throw Error("Name and Email fields must be filled");
    }
    if (!validator.isAlpha(name, ["en-US"], { ignore: "-s" })) {
      throw Error("Name can only have letters");
    }
    if (!validator.isEmail(email)) {
      throw Error("Email not valid");
    }

    const updateData = { name, email };

    if (password) {
      if (!validator.isStrongPassword(password)) {
        throw Error("Password not strong enough");
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      updateData.password = hash;
    }

    const response = await petOwner.findByIdAndUpdate(userID, updateData, {
      new: true,
    });
    res.status(200).json({
      username: response.name,
      email: response.email,
      isOAuth: !!response.oauthProvider,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUserDetailsFromToken = async (req, res) => {
  const userID = req.user.id;
  try {
    const userExist = await petOwner.findById(userID);
    if (!userExist) {
      throw Error("User doesnt exist");
    }

    await petOwner.findByIdAndDelete(userID);
    res.status(200).json({ message: "User removed" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUserFromUserID = async (req, res) => {
    const { userID } = req.params
    
    // Check if user is authenticated 
    if (!req.user) {
        return res.status(401).json({message: 'Authentication required'})
    }
    
    // Check if user has admin role 
    if (req.user.role !== 'admin') {
        return res.status(403).json({message: 'Admin access required'})
    }

    try{
        // Validate user ID format
        if (!require('mongoose').Types.ObjectId.isValid(userID)) {
            return res.status(400).json({message: 'Invalid user ID format'})
        }
    
        const userExist = await petOwner.findById(userID)
        
        if(!userExist){
            return res.status(404).json({message: "User not found"})
        }

        const response = await petOwner.findByIdAndDelete(userID)
        res.status(200).json({message: "User deleted successfully"})

    } catch (error){
        console.error('User deletion error:', error)
        res.status(500).json({message: 'Failed to delete user'})
    }

}

const getAllUsers = async (req, res) => {
  try {
    const response = await petOwner.find().select("-password");
    if (!response) {
      throw Error("Couldnt Fetch Data");
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verifyToken = async (req, res) => {
  const userID = req.user.id;
  try {
    if (!userID) {
      throw Error("Invalid Token");
    }

    const response = await petOwner.findById(userID);
    if (!response) {
      throw Error("Invalid User");
    }

    res.status(200).json({
      message: "VALID USER",
      user: {
        id: response._id,
        name: response.name,
        email: response.email,
        isOAuth: !!response.oauthProvider,
        avatar: response.avatar,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  login,
  signin,
  updateUserDetailsFromToken,
  deleteUserDetailsFromToken,
  getAllUsers,
  verifyToken,
  deleteUserFromUserID,
};
