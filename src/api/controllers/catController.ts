// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner
// - catDeleteAdmin - only admin can delete cat
// - catDelete - only owner can delete cat
// - catPut - only owner can update cat
// - catGet - get cat by id
// - catListGet - get all cats
// - catPost - create new cat

import {NextFunction, Request, Response} from 'express';
import {validationResult} from 'express-validator';
import CustomError from '../../classes/CustomError';
import catModel from '../models/catModel';
import rectangleBounds from '../../utils/rectangleBounds';
import {Types} from 'mongoose';
import {Cat} from '../../types/DBTypes';
import {error} from 'console';
import {MessageResponse} from '../../types/MessageTypes';

const catGetByUser = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user) {
      throw new CustomError('No user', 400);
    }
    const cats = await catModel.find({owner: res.locals.user._id});
    if (!cats[0]) {
      throw new CustomError('No cats found', 404);
    }
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catGetByBoundingBox = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const tr = (req.query.topRight as string).split(',');
    const bl = (req.query.bottomLeft as string).split(',');
    const topRight = {
      lat: Number(tr[0]),
      lng: Number(tr[1]),
    };
    const bottomLeft = {
      lat: Number(bl[0]),
      lng: Number(bl[1]),
    };
    const box = rectangleBounds(topRight, bottomLeft);
    const cats = await catModel.find().where('location').within(box);
    if (!cats[0]) {
      throw new CustomError('No cats found', 404);
    }
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id).populate('owner');
    if (!cat) {
      throw new CustomError('No cat found', 404);
    }
    res.json(cat);
  } catch (error) {
    next(error);
  }
};

const catListGet = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await catModel.find().populate('owner');
    console.log(cats[0]);
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catPost = async (
  req: Request<{}, {}, Cat>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  try {
    const cat = {
      ...req.body,
      owner: res.locals.user._id,
      location: res.locals.coords,
    };
    const response = await catModel.create(cat);
    res.json({message: 'Cat created', data: response});
  } catch (error) {
    next(error);
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!res.locals.user._id) {
      throw new CustomError('No user', 400);
    }
    const response = await catModel.findOneAndUpdate(
      {
        owner: res.locals.user._id,
        _id: req.params.id,
      },
      req.body,
      {new: true}
    );

    if (!response) {
      throw new CustomError('No cat found', 404);
    }

    res.json({message: 'Cat updated', data: response});
  } catch (error) {
    next(error);
  }
};

const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (res.locals.user.role !== 'admin') {
      throw new CustomError('Not authorized', 401);
    }

    const response = await catModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!response) {
      throw new CustomError('Cat not found', 400);
    }
    res.json({message: 'Cat updated', data: response});
  } catch (error) {
    next(error);
  }
};

const catDelete = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!res.locals.user) {
      throw new CustomError('No user', 400);
    }
    const response = await catModel.findOneAndDelete({
      owner: res.locals.user._id,
      _id: req.params.id,
    });
    res.json({message: 'Cat deleted', data: response});
  } catch (error) {
    next(error);
  }
};

const catDeleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (res.locals.user && res.locals.user.role !== 'admin') {
      throw new CustomError('Unauthorized', 401);
    }
    const response = await catModel.findByIdAndDelete(req.params.id);
    if (!response) {
      throw new CustomError('No cat found', 404);
    }
    res.json({message: 'Cat deleted', data: response});
  } catch (error) {
    next(error);
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
};
