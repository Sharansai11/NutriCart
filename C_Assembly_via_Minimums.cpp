#include <bits/stdc++.h>
using namespace std;
 
#define Code ios_base::sync_with_stdio(false);
#define By cin.tie(NULL);
#define Sharan cout.tie(NULL);
 
// Aliases
using ll = long long;
using lld = long double;
using ull = unsigned long long;
 
// Constants
const lld pi = 3.141592653589793238;
const ll INF = LONG_LONG_MAX;
const ll mod = 1e9 + 7;
 
// Typedef
typedef pair<ll, ll> pll;
typedef vector<ll> vll;
typedef vector<pll> vpll;
typedef vector<string> vs;
typedef unordered_map<ll, ll> umll;
typedef map<ll, ll> mll;
 
// Macros
#define ff first
#define ss second
#define pb push_back
#define mp make_pair
#define fl(i, n) for(int i = 0; i < n; i++)
#define rl(i, m, n) for(int i = n; i >= m; i--)
#define py cout << "YES\n";
#define pm cout << "-1\n";
#define pn cout << "NO\n";
 
#define all(a) a.begin(), a.end()
#define allr(a) a.rbegin(), a.rend()
#define endl "\n"
#define mini(a) *min_element(all(a))
#define maxi(a) *max_element(all(a))
 
// Operator overloads
template<typename T1, typename T2> // cin >> pair<T1, T2>
istream& operator>>(istream &istream, pair<T1, T2> &p) {
    return (istream >> p.first >> p.second);
}
template<typename T> // cin >> vector<T>
istream& operator>>(istream &istream, vector<T> &v) {
    for (auto &it : v) cin >> it;
    return istream;
}
template<typename T1, typename T2> // cout << pair<T1, T2>
ostream& operator<<(ostream &ostream, const pair<T1, T2> &p) {
    return (ostream << p.first << " " << p.second);
}
template<typename T> // cout << vector<T>
ostream& operator<<(ostream &ostream, const vector<T> &c) {
    for (auto &it : c) cout << it << " "; 
    return ostream;
}
 
// Utility functions
template <typename T>
void print(T &&t) { cout << t << "\n"; }
void printarr(ll arr[], ll n) { fl(i, n) cout << arr[i] << " "; cout << "\n"; }
template<typename T>
void printvec(vector<T> v) { ll n = v.size(); fl(i, n) cout << v[i] << " "; cout << "\n"; }
template<typename T>
ll sumvec(vector<T> v) { ll n = v.size(); ll s = 0; fl(i, n) s += v[i]; return s; }
 
// Sorting
bool sorta(const pair<int, int> &a, const pair<int, int> &b) { return (a.second < b.second); }
bool sortd(const pair<int, int> &a, const pair<int, int> &b) { return (a.second > b.second); }
 
// Bits
string decToBinary(int n) {
    string s = ""; int i = 0;
    while (n > 0) {
        s = to_string(n % 2) + s;
        n = n / 2;
        i++;
    }
    return s;
}
ll binaryToDecimal(string n) {
    string num = n;
    ll dec_value = 0;
    int base = 1;
    int len = num.length();
    for (int i = len - 1; i >= 0; i--) {
        if (num[i] == '1') dec_value += base;
        base = base * 2;
    }
    return dec_value;
}
 
// Check functions
bool isPowerOfTwo(int n) {
    if (n == 0) return false;
    return (ceil(log2(n)) == floor(log2(n)));
}
bool isPerfectSquare(ll x) {
    if (x >= 0) {
        ll sr = sqrt(x);
        return (sr * sr == x);
    }
    return false;
}
 
// Prime check
bool isprime(ll n) {
    if (n <= 1) return false;
    else if (n <= 3) return true;
    else if (n % 2 == 0 || n % 3 == 0) return false;
    for (ll i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}
 
ll fact[100000];
 
void factorial() {
    fact[0] = 1;
    for (ll i = 1; i < 100000; i++) {
        fact[i] = (i * fact[i - 1]) % mod;
    }
}
 
ll binexp(ll a, ll b) {
    ll res = 1;
    a %= mod;
    while (b) {
        if (b % 2) res = (res * a) % mod;
        a = (a * a) % mod;
        b >>= 1;
    }
    return res;
}
 
ll coeff1, coeff2;
 
void gcd_extended(ll a, ll b) {
    if (b == 0) {
        coeff1 = 1;
        coeff2 = 0;
    } else {
        gcd_extended(b, a % b);
        ll temp;
        temp = coeff1;
        coeff1 = coeff2;
        coeff2 = temp - (a / b) * coeff2;
    }
}
 
ll modular_inverse(ll a) {
    gcd_extended(a, mod);
    return (coeff1 % mod + mod) % mod;
}
 
ll nCr(ll n, ll r) {
    if (r > n / 2) r = (n - r);
    ll num = 1, den = 1, i;
    for (i = 1; i <= r; i++) {
        den = (den * i) % mod;
        num = (num * (n - i + 1)) % mod;
    }
    den = modular_inverse(den);
    return (num * den) % mod;
}
pair<int, int> count01(const vector<int>& arr) {
    int n=arr.size();
    int count_0 = 0, count_1 = 0;
    for (int x : arr) (x == 0 ? count_0 : count_1)++;
    return {count_0, count_1};
}
 
#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    cin >> n;
    int m = n * (n - 1) / 2;
    multiset<int> b;
    for (int i = 0; i < m; ++i) {
        int x;
        cin >> x;
        b.insert(x);
    }
    vector<int> a;
    for (int i = 1; i < n; ++i) {
        int x = *b.begin();
        a.push_back(x);
        for (int j = 0; j < n - i; ++j) {
            b.erase(b.find(x));
        }
    }
    a.push_back(1e9);
    for (int val : a) {
        cout << val << " ";
    }
    cout << endl;
}

 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
// Main function
int main() {
    Code By Sharan;
 
    ll t=1;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}