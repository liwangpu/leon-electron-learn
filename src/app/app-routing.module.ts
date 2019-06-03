
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    {
        path: 'morejee',
        loadChildren: './feature/morejee/morejee.module#MorejeeModule'
    }
    , { path: '**', redirectTo: 'morejee' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
