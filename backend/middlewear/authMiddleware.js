const jwt = require('jsonwebtoken');
const PetOwner = require('../models/petOwnerModel');
const Doctor = require('../models/doctorModel');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.SECRET);
        
        if (decoded.role) {
            if (decoded.role === 'admin') {
                req.user = { 
                    id: decoded._id, 
                    email: decoded.email, 
                    name: 'John Admin',
                    role: 'admin' 
                };
                return next();
            }
            
            let user;
            if (decoded.role === 'doctor') {
                user = await Doctor.findById(decoded._id);
            } else if (decoded.role === 'petOwner') {
                user = await PetOwner.findById(decoded._id);
            }

            if (!user) {
                return res.status(401).json({ error: 'User no longer exists' });
            }

            req.user = { 
                id: decoded._id, 
                email: decoded.email, 
                name: user.name,
                role: decoded.role 
            };
            return next();
        }

        // Try to find user in petOwner collection
        let user = await PetOwner.findById(decoded._id);
        let role = 'petOwner';
        
        // If not found in petOwner, try doctor collection
        if (!user) {
            user = await Doctor.findById(decoded._id);
            role = 'doctor';
        }

        // If user not found in either collection
        if (!user) {
            return res.status(401).json({ error: 'User no longer exists' });
        }

        req.user = { 
            id: decoded._id, 
            email: user.email, 
            name: user.name,
            role: role 
        };
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const requireDoctor = (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({ error: 'Doctor access required' });
    }
    next();
};

const requireAdminOrDoctor = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
        return res.status(403).json({ error: 'Admin or Doctor access required' });
    }
    next();
};

module.exports = { 
    authenticateToken, 
    requireAdmin, 
    requireDoctor, 
    requireAdminOrDoctor 
};