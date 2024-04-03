// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from res.locals.user as UserOutput. No need for database query

import {hashSync} from 'bcryptjs';
import {NextFunction, Request, Response} from 'express';
import {User, UserOutput} from '../../types/DBTypes';
import CustomError from '../../classes/CustomError';
import userModel from '../models/userModel';
import {MessageResponse} from '../../types/MessageTypes';
import mongoose from 'mongoose';

const userGet = async (
  req: Request<{id: number}, {}, {}>,
  res: Response<User>,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const userListGet = async (
  req: Request,
  res: Response<User[]>,
  next: NextFunction
) => {
  try {
    const users = await userModel.find().select('-password -role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response<MessageResponse & {data: Omit<User, 'password' | 'role'>}>,
  next: NextFunction
) => {
  try {
    const {user_name, email} = req.body;
    const password = hashSync(req.body.password, 10);
    const user = {
      user_name,
      email,
      password,
    };
    const response = await userModel.create(user);
    const outUser = {
      user_name: response.user_name,
      email: response.email,
      _id: response._id,
    };
    res.json({message: 'User created', data: outUser});
  } catch (error) {
    next(error);
  }
};

const userPutCurrent = async (
  req: Request<{}, {}, User>,
  res: Response<MessageResponse & {data: UserOutput}>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user._id) {
      throw new CustomError('No user found', 404);
    }
    const outUser = {
      user_name: req.body.user_name,
      email: req.body.email,
      _id: req.body._id,
    };
    const response = await userModel.findByIdAndUpdate(
      res.locals.user._id,
      req.body
    );
    if (!response) {
      throw new CustomError('No user found', 404);
    }
    res.json({message: 'User updated', data: outUser});
  } catch (error) {
    next(error);
  }
};

const userDeleteCurrent = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!res.locals.user) {
      throw new CustomError('No user found', 404);
    }
    const response = await userModel.findByIdAndDelete(res.locals.user._id);
    if (!response) {
      throw new CustomError('No user found', 404);
    }
    const outUser = {
      _id: response._id,
      user_name: response.user_name,
      email: response.email,
    };
    res.json({message: 'User deleted', data: outUser});
  } catch (error) {
    next(error);
  }
};

const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!res.locals.user) {
      throw new CustomError('No user', 400);
    }
    const response = await userModel
      .findById(res.locals.user._id)
      .select('-password -role');
    res.json(response);
  } catch (error) {
    next(error);
  }
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
