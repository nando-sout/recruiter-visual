

import { Bloghandlers } from 'src/api/blog/blogdata';
import { NotesHandlers } from 'src/api/notes/notedata';
import { TicketHandlers } from 'src/api/ticket/ticket-data';
import { VagasHandlers } from 'src/api/vagas/vagas-data';


export const mockHandlers = [
  ...Bloghandlers,
  ...NotesHandlers,
  ...TicketHandlers,
  ...VagasHandlers,
];
