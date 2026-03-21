import { createRouter, createWebHistory } from 'vue-router';
import Posts from '../pages/Posts.vue';
import PostView from '../pages/PostView.vue';
import About from '../pages/About.vue';
import Games from '../pages/Games.vue';

const routes = [
  { path: '/', component: Posts },
  { path: '/posts/:slug', component: PostView, props: true },
  { path: '/about', component: About },
  { path: '/games', component: Games },
];

export default createRouter({
  history: createWebHistory(),
  routes
});
