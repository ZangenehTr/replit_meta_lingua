import { IStorage } from "./storage";
import { AcademicDbStorage } from "./database-storage/academic-db-storage";

export class DatabaseStorage extends AcademicDbStorage implements IStorage {}
