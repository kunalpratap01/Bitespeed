import { Request, Response } from 'express';
import { identify } from '../services/contact.service';

export const identifyContact = async (req: Request, res: Response) => {
  try {
    const result = await identify(req.body.email, req.body.phoneNumber);
    res.status(200).json({ contact: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
