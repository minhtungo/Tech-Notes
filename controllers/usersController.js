const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

//@desc Get all users
//@route GET /users
//@access Private

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await user.find().select('-password').lean();
  if (!users) {
    return res.status(400).json({ message: 'No users found' });
  }
  res.json(users);
});

//@desc Create new user
//@route POST /users
//@access Private

const createNewUsers = asyncHandler(async (req, res) => {
  const { userName, password, roles } = req.body;

  //Confirm data
  if (!userName || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  //Check for duplicate
  const duplicate = await User.findOne({ userName }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate user' });
  }

  //Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const userObject = { userName, password: hashedPassword, roles };

  //Create and store new users
  const user = await User.create(userObject);

  if (user) {
    res.status(200).json({ message: `New user ${userName} created` });
  } else {
    res.status(400).json({ message: 'Invalid user data received' });
  }
});

//@desc Update a user
//@route PATCH /users
//@access Private

const updateUser = asyncHandler(async (req, res) => {
  const { id, userName, roles, active, password } = req.body;

  //Confirm data
  if (
    !id ||
    !userName ||
    !roles ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== 'boolean'
  ) {
    return res.status(400).json({ message: 'ALl fields are required' });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  //Check for duplicate
  const duplicate = await User.findOne({ userName }).lean().exec();
  //Allow updates to the original user name
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: 'Duplicate username' });
  }

  user.userName = userName;
  user.roles = roles;
  user.active = active;

  if (password) {
    //Hash password
    user.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await user.save(user);

  res.json({ message: `${updatedUser.userName} updated` });
});

//@desc Delete a user
//@route DELETE /users
//@access Private

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'User ID required' });
  }

  const notes = await Note.findOne({ user: id }).lean().exec();

  if (notes?.length) {
    return res.status(400).json({ message: 'User has assigned notes' });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const result = await deleteOne();

  const reply = `Username ${result.userName} with ID ${result._id} deleted`;

  res.json(reply);
});

module.exports = {
  getAllUsers,
  createNewUsers,
  updateUser,
  deleteUser,
};
