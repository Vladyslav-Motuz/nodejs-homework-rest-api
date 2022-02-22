const fs = require("fs/promises");
const path = require("path");
const {v4} = require("uuid");
const contactsPath = path.join(__dirname, "contacts.json");

const listContacts = async () => {
  const data = await fs.readFile(contactsPath);
  const contacts = JSON.parse(data);
  return contacts;
};

const getContactById = async (contactId) => {
  const contacts = await listContacts();
  const result = contacts.find(contact => contact.id === contactId);
  if (!result) {
    return null;
  };
  return result;
};

const removeContact = async (contactId) => {
  const contacts = await listContacts();
  const contactIndex = contacts.findIndex(contact => contact.id === contactId);
  if (contactIndex === -1) {    
    return null;
  };  
  const deletedContacts = contacts.splice(contactIndex, 1); 
  await fs.writeFile(contactsPath, JSON.stringify(contacts));
  return deletedContacts;
};

const addContact = async (body) => {
  const contacts = await listContacts();
  const { name, email, phone } = body; 
  const newContact = {
    id: v4(),
    name,
    email,
    phone
  };
  const newData = [...contacts, newContact];
  await fs.writeFile(contactsPath, JSON.stringify(newData));  
  return newContact;
};

const updateContact = async (contactId, body) => {
  const contacts = await listContacts();
  const { name, email, phone } = body;
  const contactIndex = contacts.findIndex(contact => contact.id === contactId);  
  if (contactIndex === -1) {    
    return null;
  };
  contacts[contactIndex] = { id: contactId, name, email, phone };
  await fs.writeFile(contactsPath, JSON.stringify(contacts));
  return contacts[contactIndex];
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
