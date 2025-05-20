import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const identify = async (email?: string, phoneNumber?: string) => {
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email ?? undefined },
        { phoneNumber: phoneNumber ?? undefined }
      ]
    }
  });

  if (contacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: { email, phoneNumber }
    });

    return {
      primaryContatctId: newContact.id,
      emails: [newContact.email].filter(Boolean),
      phoneNumbers: [newContact.phoneNumber].filter(Boolean),
      secondaryContactIds: []
    };
  }

  let allContacts = [...contacts];
  let primaryContact = contacts.find(c => c.linkPrecedence === 'PRIMARY') || contacts[0];

  for (let c of contacts) {
    if (c.linkPrecedence === 'PRIMARY' && c.id !== primaryContact.id) {
      if (c.createdAt < primaryContact.createdAt) {
        await prisma.contact.update({
          where: { id: primaryContact.id },
          data: {
            linkPrecedence: 'SECONDARY',
            linkedId: c.id
          }
        });
        primaryContact = c;
      } else {
        await prisma.contact.update({
          where: { id: c.id },
          data: {
            linkPrecedence: 'SECONDARY',
            linkedId: primaryContact.id
          }
        });
      }
    }
  }

  const linked = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id }
      ]
    }
  });

  const emails = Array.from(new Set(linked.map(c => c.email).filter(Boolean)));
  const phones = Array.from(new Set(linked.map(c => c.phoneNumber).filter(Boolean)));
  const secondaryIds = linked.filter(c => c.linkPrecedence === 'SECONDARY').map(c => c.id);

  const isExisting = linked.some(c => c.email === email && c.phoneNumber === phoneNumber);
  if (!isExisting && (email || phoneNumber)) {
    const newSecondary = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'SECONDARY',
        linkedId: primaryContact.id
      }
    });

    secondaryIds.push(newSecondary.id);
    if (email && !emails.includes(email)) emails.push(email);
    if (phoneNumber && !phones.includes(phoneNumber)) phones.push(phoneNumber);
  }

  return {
    primaryContatctId: primaryContact.id,
    emails,
    phoneNumbers: phones,
    secondaryContactIds: secondaryIds
  };
};
