class User {
  id: number | null;
  email: string;
  firstName: string;
  attended: boolean;
  admin: boolean;
  editor: boolean;

  constructor(data: any) {
    (this.id = data.id || null),
      (this.email = data.email),
      (this.firstName = data.first_name || data.email),
      (this.attended = data.attended || false),
      (this.admin = data.is_admin || false),
      (this.editor = data.is_editor || false);
  }
}

export default User;
