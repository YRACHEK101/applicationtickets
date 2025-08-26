import { body } from "express-validator";

const roles = ['client', 'agentCommercial', 'responsibleClient', 'admin', 'projectManager', 'groupLeader', 'developer'];
const languages = ['en', 'fr', 'de', 'es', 'ar'];

export const createUserValidator = [
  body("firstName").notEmpty().withMessage("Le prénom est requis"),
  body("lastName").notEmpty().withMessage("Le nom est requis"),
  body("email").isEmail().withMessage("Email invalide"),
  body("password").isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  body("role").isIn(roles).withMessage(`Le rôle doit être parmi : ${roles.join(', ')}`),
  body("preferredLanguage").optional().isIn(languages).withMessage("Langue préférée invalide"),
  body("phone").optional().isMobilePhone().withMessage("Numéro de téléphone invalide")
];

export const updateUserValidator = [
  body("firstName").optional().notEmpty().withMessage("Le prénom ne peut pas être vide"),
  body("lastName").optional().notEmpty().withMessage("Le nom ne peut pas être vide"),
  body("email").optional().isEmail().withMessage("Email invalide"),
  body("role").optional().isIn(roles).withMessage("Rôle invalide"),
  body("preferredLanguage").optional().isIn(languages).withMessage("Langue préférée invalide"),
  body("phone").optional().isMobilePhone().withMessage("Numéro de téléphone invalide")
];
