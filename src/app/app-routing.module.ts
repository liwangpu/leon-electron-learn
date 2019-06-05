
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService } from '@app/core';

const routes: Routes = [
    {
        path: 'app',
        loadChildren: './feature/main/main.module#MainModule',
        canActivate: [AuthGuardService]
    }
    , {
        path: 'public',
        loadChildren: './feature/public/public.module#PublicModule'
    }
    , { path: '**', redirectTo: 'app' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
