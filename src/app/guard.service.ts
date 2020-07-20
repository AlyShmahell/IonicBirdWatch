import { Injectable } from "@angular/core";
import { Router, CanActivate, ActivatedRouteSnapshot } from "@angular/router";
import { SQLiteProvider } from './sqlite.provider';

@Injectable({
  providedIn: "root"
})
export class AuthGuardService implements CanActivate {
  constructor(private router: Router, private db: SQLiteProvider) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    console.log(route);

    let authInfo = (async()=>{
        var res = await this.db.dbInstance.executeSql(`SELECT * from auth`);
        if (res.rows.length > 0)
            {
                console.log(res.rows)
                if (res.rows[0].status)
                    return true;
            }
        return false;
    })();

    if (!authInfo) {
      this.router.navigate(["login"]);
      return false;
    }
    return true;
  }
}