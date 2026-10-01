import { BUREAU_CONTACTS, COMMON_PABX, DIRECTORY_SUMMARY, KEY_PERSON_SECTIONS } from '../config/keyPersons.js';
import Extension from '../models/Extension.js';

export const listExtensions = async (req, res) => {
  const extensions = await Extension.find().sort({ extensionNumber: 1 });
  res.json({ success: true, data: extensions });
};

// The office contact directory behind the Extensions page. It is served from
// backend/config/keyPersons.js (the canonical PABX plan) instead of MongoDB so the
// page still renders on an install whose database has not been seeded yet. The
// registered line count is added as a soft check of the two sources; a database
// hiccup must not blank the directory, hence the catch.
export const getExtensionDirectory = async (req, res) => {
  let registeredExtensions = null;
  try {
    registeredExtensions = await Extension.countDocuments({});
  } catch (error) {
    registeredExtensions = null;
  }

  res.json({
    success: true,
    data: {
      sections: KEY_PERSON_SECTIONS,
      bureau: BUREAU_CONTACTS,
      common: COMMON_PABX,
      summary: {
        ...DIRECTORY_SUMMARY,
        registeredExtensions,
        source: 'List of key persons (ITV)',
      },
      generatedAt: new Date().toISOString(),
    },
  });
};

export const createExtension = async (req, res) => {
  const extension = await Extension.create(req.body);
  res.status(201).json({ success: true, data: extension });
};

export const updateExtension = async (req, res) => {
  const extension = await Extension.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!extension) return res.status(404).json({ success: false, message: 'Extension not found' });
  res.json({ success: true, data: extension });
};
